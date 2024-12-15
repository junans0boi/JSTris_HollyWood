package com.junzzang.TetrisBackend.util;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Configuration;
import java.util.List;

public class CurrentUserResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(org.springframework.core.MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class);
    }

    @Override
    public Object resolveArgument(org.springframework.core.MethodParameter parameter,
                                  org.springframework.web.method.support.ModelAndViewContainer mavContainer,
                                  org.springframework.web.context.request.NativeWebRequest webRequest,
                                  org.springframework.web.bind.support.WebDataBinderFactory binderFactory) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if(auth == null) return null;
        return auth.getName(); // username
    }
}

@Configuration
@ControllerAdvice
class WebConfig implements WebMvcConfigurer {
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentUserResolver());
    }
}
